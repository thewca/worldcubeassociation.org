data "aws_iam_policy_document" "codepipeline_assume_role_policy" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["codepipeline.amazonaws.com", "codebuild.amazonaws.com", "events.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "codepipeline_role" {
  name               = "${var.name_prefix}-codepipeline-role"
  description        = "The IAM role used by the pipeline"
  assume_role_policy = data.aws_iam_policy_document.codepipeline_assume_role_policy.json
}

data "aws_iam_policy_document" "codepipeline_policy" {
  statement {
    actions = [
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
    ]

    resources = [
      aws_s3_bucket.this.arn,
      "${aws_s3_bucket.this.arn}/*",
    ]
  }

  statement {
    actions   = ["ecr:DescribeImages"]
    resources = [var.shared.ecr_repository.arn]
  }

  statement {
    actions   = ["codebuild:BatchGetBuilds", "codebuild:StartBuild"]
    resources = ["*"]
  }

  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = ["*"]
  }

  statement {
    actions = [
      "ecs:DescribeTaskDefinition",
      "ecs:DescribeTasks",
      "ecs:RunTask",
    ]

    resources = ["*"]
  }

  statement {
    actions = [
      "codedeploy:CreateDeployment",
      "codedeploy:GetDeployment",
      "codedeploy:GetApplication",
      "codedeploy:GetApplicationRevision",
      "codedeploy:RegisterApplicationRevision",
      "codedeploy:GetDeploymentConfig",
      "ecs:RegisterTaskDefinition",
    ]

    resources = ["*"]
  }

  statement {
    actions   = ["codepipeline:StartPipelineExecution"]
    resources = [aws_codepipeline.this.arn]
  }

  statement {
    actions   = ["iam:PassRole"]
    resources = ["*"]
    condition {
      test     = "StringEqualsIfExists"
      variable = "iam:PassedToService"

      values = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  role   = aws_iam_role.codepipeline_role.name
  policy = data.aws_iam_policy_document.codepipeline_policy.json
}

resource "aws_codebuild_project" "build" {
  name         = "${var.name_prefix}-build"
  service_role = aws_iam_role.codepipeline_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    type                        = "LINUX_CONTAINER"
    image                       = "aws/codebuild/standard:6.0"
    image_pull_credentials_type = "CODEBUILD"
  }

  source {
    type = "CODEPIPELINE"
    buildspec = templatefile("../templates/buildspec_build.yml.tftpl", {
      container_name         = "handler"
      container_port         = 3000
      task_definition        = aws_ecs_task_definition.this.arn
      capacity_provider_name = var.shared.capacity_provider.name
    })
  }
}

data "aws_iam_policy_document" "codedeploy_assume_role_policy" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["codedeploy.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "codedeploy_role" {
  name               = "${var.name_prefix}-codedeploy-role"
  assume_role_policy = data.aws_iam_policy_document.codedeploy_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "codedeploy_role_attachment" {
  role       = aws_iam_role.codedeploy_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
}

resource "aws_codedeploy_app" "this" {
  name             = var.name_prefix
  compute_platform = "ECS"
}

resource "aws_codedeploy_deployment_group" "this" {
  app_name               = aws_codedeploy_app.this.name
  deployment_group_name  = var.name_prefix
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"
  service_role_arn       = aws_iam_role.codedeploy_role.arn

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }

    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }

  deployment_style {
    deployment_type   = "BLUE_GREEN"
    deployment_option = "WITH_TRAFFIC_CONTROL"
  }

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }

  ecs_service {
    cluster_name = var.shared.ecs_cluster.name
    service_name = aws_ecs_service.this.name
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [var.https_listener]
      }

      target_group {
        name = aws_lb_target_group.rails-blue.name
      }

      target_group {
        name = aws_lb_target_group.rails-green.name
      }
    }
  }
}

resource "aws_s3_bucket" "this" {
  bucket        = var.name_prefix
  force_destroy = true
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id = "rule-1"

    filter {}

    expiration {
      days = 30
    }

    status = "Enabled"
  }
}

resource "aws_codepipeline" "this" {
  name     = var.name_prefix
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    type     = "S3"
    location = aws_s3_bucket.this.bucket
  }

  stage {
    name = "source"

    action {
      name             = "source"
      category         = "Source"
      owner            = "AWS"
      provider         = "ECR"
      version          = "1"
      output_artifacts = ["image"]

      configuration = {
        RepositoryName = var.shared.ecr_repository.name
        ImageTag       = "latest"
      }
    }
  }

  stage {
    name = "build"

    action {
      name     = "build"
      category = "Build"
      owner    = "AWS"
      provider = "CodeBuild"
      version  = "1"

      input_artifacts  = ["image"]
      output_artifacts = ["build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.build.name
      }
    }
  }

  stage {
    name = "deploy"

    action {
      name     = "deploy"
      category = "Deploy"
      owner    = "AWS"
      provider = "CodeDeployToECS"
      version  = "1"

      input_artifacts = ["build_output"]

      configuration = {
        ApplicationName                = aws_codedeploy_app.this.name
        DeploymentGroupName            = aws_codedeploy_deployment_group.this.deployment_group_name
        TaskDefinitionTemplateArtifact = "build_output"
        TaskDefinitionTemplatePath     = "taskdef.json"
        AppSpecTemplateArtifact        = "build_output"
        AppSpecTemplatePath            = "appspec.yaml"
        Image1ArtifactName             = "build_output"
        Image1ContainerName            = "IMAGE_NAME"
      }
    }
  }
}

resource "aws_cloudwatch_event_rule" "ecr_image_push" {
  name     = "${var.name_prefix}-ecr-image-push"
  role_arn = aws_iam_role.codepipeline_role.arn

  event_pattern = jsonencode({
    source      = ["aws.ecr"]
    detail-type = ["ECR Image Action"]

    detail = {
      repository-name = [var.shared.ecr_repository.name]
      image-tag       = ["latest"]
      action-type     = ["PUSH"]
      result          = ["SUCCESS"]
    }
  })
}

resource "aws_cloudwatch_event_target" "ecr_image_push" {
  rule     = aws_cloudwatch_event_rule.ecr_image_push.name
  arn      = aws_codepipeline.this.arn
  role_arn = aws_iam_role.codepipeline_role.arn
}
